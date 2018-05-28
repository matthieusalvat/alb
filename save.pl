#!/usr/bin/perl
use POSIX qw(strftime);
use File::Basename;
my $dirname = dirname(__FILE__);

my $SECRET = $ENV{"SECRET"};
my $base="https://io.datasync.orange.com/base/alb.json";
my $DIR=$dirname."/save";
my $filename = strftime "%Y-%m-%d.json", localtime;
unless (-d $DIR) {
	mkdir($DIR);
}

my $cmd = "curl -s \"$base?auth=$SECRET&print=pretty\" > $DIR/$filename";
system($cmd);

opendir(DIR, $DIR);
my @files = readdir(DIR);
closedir(DIR);
@files = sort(@files);
if (-f $DIR."/".@files[-2] && @files[-2] ne $filename) {
	print "Make diff with previous datas\n";
	my $diff = "diff -q $DIR/$filename $DIR/".@files[-2]." > /dev/null";
	system($diff);
	if ($? < 0) {
		print "Problem detected, keep $DIR/$filename\n";
	} elsif ($? > 1) {
		print "File are different, keep $DIR/$filename\n";
	} else {
		print "File are the same, remove $DIR/$filename\n";
		unlink("$DIR/$filename");
	}
} else {
	print "Data saved in $DIR/$filename\n";
}
